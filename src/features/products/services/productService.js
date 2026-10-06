import { adminApi, api } from "@/lib/api/client";

export function getProducts(options = {}) {
  return api.get("/Products", options);
}

export function getProductById(id, options = {}) {
  return api.get(`/Products/${id}`, options);
}

export function getProductBrands(options = {}) {
  return api.get("/Products/Brands", options);
}

export function createProduct(formData, options = {}) {
  return adminApi.postForm("/Products", formData, options);
}

export function updateProduct(data, options = {}) {
  return adminApi.put("/Products", data, options);
}

export function deleteProduct(id, options = {}) {
  return adminApi.del(`/Products/${id}`, options);
}

export function activateProduct(id, options = {}) {
  return adminApi.patch(`/Products/${id}/activate`, null, options);
}

export function deactivateProduct(id, options = {}) {
  return adminApi.patch(`/Products/${id}/deactivate`, null, options);
}

export function addProductImage(id, file, options = {}) {
  const formData = new FormData();

  formData.append("file", file);

  return adminApi.postForm(
    `/Products/${id}/images`,
    formData,
    options,
  );
}

export function updateProductImage(id, imageId, file, options = {}) {
  const formData = new FormData();

  formData.append("file", file);

  return adminApi.putForm(
    `/Products/${id}/images/${imageId}`,
    formData,
    options,
  );
}

export function deleteProductImage(id, imageId, options = {}) {
  return adminApi.del(
    `/Products/${id}/images/${imageId}`,
    options,
  );
}