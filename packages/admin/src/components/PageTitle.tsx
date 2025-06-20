import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardLayout } from "../store/useDashboardLayout";
import { Title } from "@mantine/core";

interface PageTitleProps {
  title?: string;
  children?: React.ReactNode;
  right?: React.ReactNode;
  showBack?: boolean;
}

export default function PageTitle({
  title,
  children,
  right,
  showBack,
}: PageTitleProps) {
  const { isEnabled, toggleEnabled } = useDashboardLayout();
  const navigate = useNavigate();

  const handleGoBack = () => {
    isEnabled && toggleEnabled();
    navigate(-1);
  };

  const titleContent = title || children;

  return (
    <div className="flex flex-col gap-2">
      {showBack && (
        <div
          onClick={handleGoBack}
          className="flex items-center gap-2 cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span className="text-sm font-medium text-slate-500">Назад</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 mb-4">
        <Title 
          order={1} 
          size="h1"
          fw={600}
          mt="md"
        >
          {titleContent}
        </Title>
        <div>{right}</div>
      </div>
    </div>
  );
}
