import { useEffect, useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Card,
  FileButton,
  Flex,
  Text,
} from "@mantine/core";
import { API_URL } from "../common/constants";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import { confirmModal } from "../common/modals";
import { MediaFile } from "../common/database.types";

interface Props {
  label?: string;
  onDocumentReady?: (document: MediaFile) => void;
  onDocumentRemoved?: (document: MediaFile) => void;
  existingDocument?: MediaFile;
  title?: string;
  type?: string;
  accept?: string;
}

export default function SingleFileUploader({
  label = "Upload file",
  onDocumentReady,
  onDocumentRemoved,
  existingDocument,
  type = "PDF",
  accept = "application/pdf",
}: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pdfFile, setPDfFile] = useState<MediaFile | null>(null);

  useEffect(() => {
    if (existingDocument) {
      setIsUploaded(true);
      setPDfFile(existingDocument);
    }
  }, [existingDocument]);

  const handleUploadFile = async (pdfFile: File | null) => {
    if (!pdfFile) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", pdfFile);
      const { data } = await axios.post(API_URL.UPLOAD_MEDIA, formData, {
        params: {
          type,
        },
      });
      onDocumentReady?.(data);
    } catch (error) {
      notifications.show({
        message: "Failed to upload PDF document, please try again",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    setFile(file);
    handleUploadFile(file);
  };

  const handleDeleteDocument = () => {
    confirmModal({
      onConfirm() {
        setIsUploaded(false);
        setFile(null);
        setPDfFile(null);
        pdfFile && onDocumentRemoved?.(pdfFile);
      },
    });
  };

  return (
    <Box>
      {!isUploaded && (
        <FileButton onChange={handleFileChange} accept={accept}>
          {(props) => (
            <Button loading={isUploading} {...props}>
              {label}
            </Button>
          )}
        </FileButton>
      )}

      {isUploaded && (
        <Card p="xs" withBorder>
          <Flex align="center" justify="space-between">
            <Text mr="md">{file?.name}</Text>{" "}
            <ActionIcon size="sm" color="red" onClick={handleDeleteDocument}>
              <IconTrash size="sm" />
            </ActionIcon>
          </Flex>
        </Card>
      )}
    </Box>
  );
}
