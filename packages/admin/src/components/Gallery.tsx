import {
  ActionIcon,
  AspectRatio,
  Box,
  Button,
  FileButton,
  Group,
  Modal,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useState } from "react";
import { SearchIcon, TrashIcon, UploadIcon } from "lucide-react";
import { v4 as uuid } from "uuid";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { useDebouncedValue } from "@mantine/hooks";
import { API_URL } from "../common/constants";
import { confirmModal } from "../common/modals";
import { trpc } from "../common/trpc";
import EmptyPlaceholder from "./EmptyPlaceholder";
import LoadingPlaceholder from "./LoadingPlaceholder";
import PageTitle from "./PageTitle";
import { RouterOutput } from "server/src/trpc/router";
import PermissionVisibility from "./PermissionVisibility";

type SelectedFileType = { id: string; altName: string; file: File };

export async function uploadFiles(filesToUpload: SelectedFileType[]) {
  await Promise.allSettled(
    filesToUpload.map(async (newFile) => {
      const formData = new FormData();
      formData.append("file", newFile.file);
      formData.append("altName", newFile.altName);
      await axios.post(API_URL.UPLOAD_MEDIA, formData, {
        headers: {
          // Authorization: `Bearer ${token}`,
        },
        params: {
          altName: newFile.altName,
        },
      });
    })
  );
}

export type AdminMediaFile =
  RouterOutput["admin"]["gallery"]["getAllGallery"][0];

interface Props {
  onImageSelect?: (file: AdminMediaFile) => void;
}

export default function Gallery({ onImageSelect }: Props) {
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState<SelectedFileType[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [searchValue] = useDebouncedValue(search, 500);

  const { data, isLoading, refetch } =
    trpc.admin.gallery.getAllGallery.useQuery({
      altName: searchValue,
    });

  const { mutate } = trpc.admin.gallery.deleteMediaFile.useMutation();

  const handleAddFiles = (selectedFiles: File[]) => {
    setFiles(selectedFiles.map((i) => ({ altName: "", file: i, id: uuid() })));
  };

  const handleAltNameChange = (id: string, value: string) => {
    setFiles((currFiles) => {
      return currFiles.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            altName: value,
          };
        }
        return i;
      });
    });
  };

  const handleUploadFiles = async () => {
    try {
      setIsUploading(true);
      await uploadFiles(files);
      setFiles([]);
      setIsUploadModalOpen(false);
      refetch();
    } catch (error) {
      console.log(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = (id: number) => {
    confirmModal({
      title: "Подтвердите удаление",
      body: "Вы уверены, что хотите удалить этот файл? Это действие нельзя отменить.",
      onConfirm() {
        mutate(
          { id },
          {
            onSuccess() {
              notifications.show({
                message: "Файл успешно удален",
              });
              refetch();
            },
          }
        );
      },
    });
  };

  const handleOnImageSelected = (file: AdminMediaFile) => {
    setIsUploadModalOpen(false);
    onImageSelect?.(file);
  };

  return (
    <Box p="md">
      <PageTitle
        title="Галерея"
        right={
          <Group>
            <TextInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftSection={<SearchIcon />}
              placeholder="Search"
            />
            <PermissionVisibility permissions={["UPDATE_GALLERY"]}>
              <Button
                leftSection={<UploadIcon />}
                onClick={() => setIsUploadModalOpen(true)}
              >
                Загрузить новые файлы
              </Button>
            </PermissionVisibility>
          </Group>
        }
      />
      {isLoading && <LoadingPlaceholder />}

      {!isLoading && !data?.length && (
        <EmptyPlaceholder
          title="Нет доступных файлов"
          subtitle="Загрузите новые файлы, чтобы они появились здесь."
        />
      )}

      <Box>
        <SimpleGrid cols={6}>
          {data?.map((file) => (
            <Stack
              onClick={() => handleOnImageSelected?.(file)}
              pos="relative"
              key={file.id}
            >
              <AspectRatio
                style={{ borderRadius: "8px", overflow: "hidden" }}
                ratio={1}
              >
                {file.url && <img src={file.url} />}
              </AspectRatio>
              <Text>{file.altName}</Text>

              <PermissionVisibility permissions={["DELETE_GALLERY"]}>
                <ActionIcon
                  onClick={() => handleDeleteFile(file.id)}
                  color="red"
                  pos="absolute"
                  top={8}
                  right={8}
                >
                  <TrashIcon size={16} />
                </ActionIcon>
              </PermissionVisibility>
            </Stack>
          ))}
        </SimpleGrid>
      </Box>

      <Modal
        opened={isUploadModalOpen}
        onClose={() => !isUploading && setIsUploadModalOpen(false)}
        title={<Text fw="bold">Загрузить новые файлы</Text>}
        size="lg"
        centered
      >
        <ScrollArea mb="md">
          <SimpleGrid cols={2}>
            {files.map((file, index) => (
              <Box key={index}>
                <AspectRatio ratio={1}>
                  <img src={URL.createObjectURL(file.file)} />
                </AspectRatio>
                <TextInput
                  onChange={(e) => handleAltNameChange(file.id, e.target.value)}
                  value={file.altName}
                  label="Имя изображения"
                  required
                />
              </Box>
            ))}
          </SimpleGrid>
        </ScrollArea>

        {!!files.length && (
          <Button loading={isUploading} onClick={handleUploadFiles} fullWidth>
            Загрузить
          </Button>
        )}

        {!files.length && (
          <FileButton
            onChange={handleAddFiles}
            accept="image/png,image/jpeg"
            multiple
          >
            {(props) => (
              <Button fullWidth {...props}>
                Выбрать новые файлы
              </Button>
            )}
          </FileButton>
        )}
      </Modal>
    </Box>
  );
}
