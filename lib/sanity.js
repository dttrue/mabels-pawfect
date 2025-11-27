// lib/sanity.js
import { createClient } from "next-sanity";

export const sanityClient = createClient({
  projectId: "s0120ijs",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
});
