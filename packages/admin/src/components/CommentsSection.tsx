import React from "react";
import {
  Paper,
  Text,
  Stack,
  Textarea,
  Group,
  Button,
  Divider,
  Card,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { MessageCircle } from "lucide-react";
import { trpc } from "../common/trpc";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: {
    firstName: string | null;
    lastName: string | null;
  };
}

interface CommentsSectionProps {
  requestId: string;
  comments: Comment[];
  onCommentAdded?: () => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  requestId,
  comments,
  onCommentAdded,
}) => {
  const commentForm = useForm({
    initialValues: {
      comment: "",
    },
    validate: {
      comment: (value: string) =>
        value.length < 1 ? "Comment is required" : null,
    },
  });

  const addCommentMutation = trpc.admin.workflows.addComment.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Success",
        message: "Comment added successfully",
        color: "green",
      });
      commentForm.reset();
      onCommentAdded?.();
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to add comment",
        color: "red",
      });
    },
  });

  const handleAddComment = (values: { comment: string }) => {
    addCommentMutation.mutate({
      requestId,
      text: values.comment,
    });
  };

  return (
    <Paper shadow="sm" p="lg" withBorder>
      <Text size="lg" fw={500} mb="md">
        Comments
      </Text>

      {/* Add Comment Form */}
      <form onSubmit={commentForm.onSubmit(handleAddComment)}>
        <Stack gap="md">
          <Textarea
            placeholder="Add a comment..."
            {...commentForm.getInputProps("comment")}
          />
          <Group justify="flex-end">
            <Button
              type="submit"
              leftSection={<MessageCircle size={16} />}
              loading={addCommentMutation.isPending}
              disabled={!commentForm.values.comment.trim()}
            >
              Add Comment
            </Button>
          </Group>
        </Stack>
      </form>

      <Divider my="md" />

      {/* Comments List */}
      {comments && comments.length > 0 ? (
        <Stack gap="md">
          {comments.map((comment) => (
            <Card key={comment.id} withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={500}>
                  {comment.author.firstName} {comment.author.lastName}
                </Text>
                <Text size="xs" c="dimmed">
                  {new Date(comment.createdAt).toLocaleString()}
                </Text>
              </Group>
              <Text size="sm">{comment.text}</Text>
            </Card>
          ))}
        </Stack>
      ) : (
        <Text c="dimmed" ta="center" py="md">
          No comments yet
        </Text>
      )}
    </Paper>
  );
};
