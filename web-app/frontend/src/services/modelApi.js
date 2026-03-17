import api from "./api";

// Run inference
export const runInference = (data) =>
  api.post("/admin/model-inference", data);

// Get model health
export const getModelHealth = () =>
  api.get("/admin/model-health");

// Get model versions
export const getModelVersions = () =>
  api.get("/admin/model-versions");