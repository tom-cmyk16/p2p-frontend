import NotificationAlert from "./NotificationAlert";

export default function SuccessMessage({
  message,
  children,
  duration = 5000,
  onDismiss,
  className = "",
}) {
  const content = message || children;
  if (!content) return null;

  return (
    <NotificationAlert
      message={content}
      type="success"
      duration={duration}
      onDismiss={onDismiss}
      className={className}
    />
  );
}
