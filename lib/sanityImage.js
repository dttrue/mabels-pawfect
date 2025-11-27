// lib/sanityImage.js
import imageUrlBuilder from "@sanity/image-url";
import { sanityClient } from "./sanity";

const config = sanityClient.config();
const builder = imageUrlBuilder({
  projectId: config.projectId,
  dataset: config.dataset,
});

export function urlFor(source) {
  return builder.image(source);
}
