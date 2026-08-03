import { useState, useEffect } from "react";

const DoctorAvatar = ({
  name,
  imageUrl,
  sizeClass = "h-14 w-14",
  textClass = "text-xl",
  fallbackClass = "bg-blue-100 text-blue-600",
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  const initial = name ? name.charAt(0).toUpperCase() : "?";

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={name}
        onError={() => setFailed(true)}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full ${fallbackClass} flex items-center justify-center font-medium ${textClass} flex-shrink-0`}
    >
      {initial}
    </div>
  );
};

export default DoctorAvatar;
