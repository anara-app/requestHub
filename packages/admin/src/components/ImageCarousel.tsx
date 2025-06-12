import "@mantine/carousel/styles.css";
import { Carousel } from "@mantine/carousel";
// import { MediaFile } from "../common/database.types";

interface Props {
  media?: any[];
  mediaMetaData?: any[];
}

export default function ImageCarousel({ media, mediaMetaData }: Props) {
  console.log({ mediaMetaData });

  return (
    <Carousel withIndicators height={200} w="100%">
      {media?.map((image) => (
        <Carousel.Slide key={image.id}>
          <img
            style={{ objectFit: "contain", width: "100%", height: "100%" }}
            src={image.url!}
            alt={image.filename!}
          />
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}
