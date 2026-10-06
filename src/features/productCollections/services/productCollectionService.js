import { adminApi, api } from "@/lib/api/client";

export function getProductCollections(options = {}) {
  return adminApi.get("/ProductCollections", options);
}

export function getProductsByCollection(collectionType, options = {}) {
  return api.get("/Products/Collections", {
    ...options,
    params: {
      ...options.params,
      CollectionType: collectionType,
    },
  });
}

export function getProductCollectionById(id, options = {}) {
  return adminApi.get(`/ProductCollections/${id}`, options);
}

export function createProductCollection(data, options = {}) {
  return adminApi.post("/ProductCollections", data, options);
}

export function updateProductCollection(data, options = {}) {
  return adminApi.put("/ProductCollections", data, options);
}

export function deleteProductCollection(id, options = {}) {
  return adminApi.del(`/ProductCollections/${id}`, options);
}