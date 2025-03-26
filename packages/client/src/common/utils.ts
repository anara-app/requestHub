import { ArticleType } from "@/app/[locale]/page";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale/ru";

export function formatArticlePublishedDate(publishedAt: string) {
  return formatDistanceToNow(new Date(publishedAt), {
    addSuffix: true,
    locale: ru,
  });
}