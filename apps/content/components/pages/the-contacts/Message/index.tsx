import { useTranslations } from "next-intl";

interface MessageProps {
  message?: string;
}

function Message({ message }: MessageProps) {
  const t = useTranslations("ContactsPage");

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="border-b border-gray-200 pb-2 mb-4">
        <h3 className="font-semibold text-lg ">{t("message_title")}</h3>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-md p-4">
        {message ? (
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
            {message}
          </p>
        ) : (
          <p className="text-gray-400 text-sm italic">{t("no_message")}</p>
        )}
      </div>
    </div>
  );
}

export default Message;
