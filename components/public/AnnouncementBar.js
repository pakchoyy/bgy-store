export default function AnnouncementBar({ text, url, bgColor, textColor }) {
  if (!text) return null;

  const content = (
    <div
      className="text-center text-sm py-2 px-4 font-medium"
      style={{ backgroundColor: bgColor || '#0ea5a0', color: textColor || '#ffffff' }}
    >
      {text}
    </div>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
}
