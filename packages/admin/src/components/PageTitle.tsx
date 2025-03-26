import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardLayout } from "../store/useDashboardLayout";

export default function PageTitle({
  title,
  right,
  showBack,
}: {
  title: string;
  right?: React.ReactNode;
  showBack?: boolean;
}) {
  const { isEnabled, toggleEnabled } = useDashboardLayout();
  const navigate = useNavigate();

  const handleGoBack = () => {
    isEnabled && toggleEnabled();
    navigate(-1);
  };

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
        <h1 className="text-2xl font-bold">{title}</h1>
        <div>{right}</div>
      </div>
    </div>
  );
}
