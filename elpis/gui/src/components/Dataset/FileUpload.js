import React, {Component} from "react";
import classNames from "classnames";
import Dropzone from "react-dropzone";
import {Button} from "semantic-ui-react";
import {fromEvent} from "file-selector";
import {withTranslation} from "react-i18next";
import {datasetFiles} from "redux/actions/datasetActions";
import {connect} from "react-redux";

class FileUpload extends Component {
    parseElan = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => {
                const parser = new DOMParser();
                const eafDoc = parser.parseFromString(reader.result, "application/xml")
                const wavUrl = eafDoc
                    .getElementsByTagName("ANNOTATION_DOCUMENT")[0]
                    .getElementsByTagName("HEADER")[0]
                    .getElementsByTagName("MEDIA_DESCRIPTOR")[0]
                    .getAttribute("RELATIVE_MEDIA_URL").split("./")[1];
                resolve(wavUrl);
            }
            reader.onerror = () => {
                reject(reader.error);
            }
        })
    }

    onDrop = async (acceptedFiles) => {
        console.log("files dropped:", acceptedFiles);
        const eafFiles = acceptedFiles.filter(file => file.name.split('.').pop() === "eaf");
        const wavFileNames = acceptedFiles.filter(file => file.name.split('.').pop() === "wav").map(file => file.name);

        for (let i = 0; i < eafFiles.length; i++) {
            const parsedWavFile = await this.parseElan(eafFiles[i]);
            const identicalWavFile = eafFiles[i].name.split('.')[0].concat(".wav");
            if (!wavFileNames.includes(parsedWavFile) && !wavFileNames.includes(identicalWavFile)) {
                console.log("Missing wav file, provide either", identicalWavFile, "or", parsedWavFile);
            }
        }
        var formData = new FormData();

        acceptedFiles.forEach(file => {
            formData.append("file", file);
        });
        this.props.datasetFiles(formData);
    }

    render() {
        const {t, name} = this.props;
        const interactionDisabled = name ? false : true;

        return (
            <div className="FileUpload">
                <Dropzone
                    disabled={interactionDisabled}
                    className="dropzone"
                    onDrop={this.onDrop}
                    getDataTransferItems={evt => fromEvent(evt)}
                >
                    {({getRootProps, getInputProps, isDragActive}) => {
                        return (
                            <div
                                {...getRootProps()}
                                className={classNames("dropzone", {
                                    dropzone_active: isDragActive,
                                })}
                            >
                                <input {...getInputProps()} />
                                {isDragActive ?
                                    <p>{t("dataset.fileUpload.dropFilesHintDragActive")}</p> :
                                    <p>{t("dataset.fileUpload.dropFilesHint")}</p>
                                }
                                <Button>{t("dataset.files.uploadButton")}</Button>
                            </div>
                        );
                    }}
                </Dropzone>
            </div>
        );
    }
}


const mapDispatchToProps = dispatch => ({
    datasetFiles: postData => {
        dispatch(datasetFiles(postData));
    },
});

export default connect(null, mapDispatchToProps)(
    withTranslation("common")(FileUpload)
);
