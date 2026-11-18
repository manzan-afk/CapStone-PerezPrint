import "./OrderImages.css";

const IMAGE_EXTENSION = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?.*)?$/i;

function isImageFile(file) {
  return Boolean(file?.url) && (IMAGE_EXTENSION.test(file.name || "") || IMAGE_EXTENSION.test(file.url));
}

// Thumbnails of the image files attached to an order; each opens the full image.
export default function OrderImages({ files }) {
  const images = (files || []).filter(isImageFile);
  if (images.length === 0) return null;

  return (
    <div className="order-images">
      {images.map((file, index) => (
        <a
          key={index}
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="order-images__item"
          title={file.name}
        >
          <img src={file.url} alt={file.name || "Order attachment"} loading="lazy" />
        </a>
      ))}
    </div>
  );
}
