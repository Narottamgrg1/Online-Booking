import { useEffect, useRef } from "react";

const UploadWidget = ({ uwConfig, setState, multiple = false }) => {
  const uploadWidgetRef = useRef(null);
  const uploadButtonRef = useRef(null);

  useEffect(() => {
    const initializeUploadWidget = () => {
      if (window.cloudinary && uploadButtonRef.current) {
        uploadWidgetRef.current = window.cloudinary.createUploadWidget(
          { ...uwConfig, multiple },
          (error, result) => {
            if (error) {
              console.error("Upload error:", error);
              return;
            }

            if (result && result.event === "success") {
              console.log("Upload successful:", result.info.secure_url);

              setState((prev) => {
                if (multiple) {
                  return Array.isArray(prev) ? [...prev, result.info.secure_url] : [result.info.secure_url];
                } else {
                  return result.info.secure_url; // Single image case
                }
              });
            }
          }
        );

        const handleUploadClick = (e) => {
          e.preventDefault();
          if (uploadWidgetRef.current) {
            uploadWidgetRef.current.open();
          }
        };

        const buttonElement = uploadButtonRef.current;
        buttonElement.addEventListener("click", handleUploadClick);

        return () => {
          buttonElement.removeEventListener("click", handleUploadClick);
        };
      }
    };

    if (window.cloudinary) {
      initializeUploadWidget();
    } else {
      console.error("Cloudinary script not loaded!");
    }
  }, [uwConfig, setState, multiple]);

  return (
    <button ref={uploadButtonRef} id="upload_widget" className="cloudinary-button">
      Upload
    </button>
  );
};

export default UploadWidget;
