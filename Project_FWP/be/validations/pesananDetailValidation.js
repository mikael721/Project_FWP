// validations/pesananDetailValidation.js
const Joi = require("joi");

const createPesananDetailSchema = Joi.object({
  menu_id: Joi.number().integer().required().messages({
    "number.base": "Menu ID harus berupa angka yang valid.",
    "any.required": "Menu ID wajib diisi.",
  }),
  pesanan_detail_jumlah: Joi.number().integer().min(1).required().messages({
    "number.base": "Jumlah harus berupa angka yang valid.",
    "number.min": "Jumlah minimal adalah 1.",
    "any.required": "Jumlah wajib diisi.",
  }),
  pesanan_id: Joi.number().integer().required().messages({
    "number.base": "Pesanan ID harus berupa angka yang valid.",
    "any.required": "Pesanan ID wajib diisi.",
  }),
  subtotal: Joi.number().positive().required().messages({
    "number.base": "Subtotal harus berupa angka yang valid.",
    "number.positive": "Subtotal harus lebih dari 0.",
    "any.required": "Subtotal wajib diisi.",
  }),
});
const createPesananSchema = Joi.object({
  pesanan_nama: Joi.string().min(1).max(255).required().trim().messages({
    "string.empty": "Nama pesanan wajib diisi.",
    "string.min": "Nama pesanan harus terdiri dari minimal 1 karakter.",
    "any.required": "Nama pesanan wajib diisi.",
  }),
  pesanan_lokasi: Joi.string().min(1).max(255).required().trim().messages({
    "string.empty": "Lokasi pesanan wajib diisi.",
    "string.min": "Lokasi pesanan harus terdiri dari minimal 1 karakter.",
    "any.required": "Lokasi pesanan wajib diisi.",
  }),
  pesanan_email: Joi.string().email().required().trim().lowercase().messages({
    "string.email": "Email harus berupa alamat email yang valid.",
    "string.empty": "Email wajib diisi.",
    "any.required": "Email wajib diisi.",
  }),
  nomer_telpon: Joi.string().min(9).max(20).required().messages({
    "string.empty": "Nomor telepon wajib diisi.",
    "string.min": "Nomor telepon harus terdiri dari minimal 9 karakter.",
    "string.max": "Nomor telepon tidak boleh lebih dari 20 karakter.",
    "any.required": "Nomor telepon wajib diisi.",
  }),
  pesan: Joi.string().allow("", null).messages({
    "string.empty": "Pesan tidak valid.",
  }),
  pesanan_tanggal: Joi.string().allow(null).messages({
    "string.empty": "Tanggal pesanan tidak valid.",
  }),
  pesanan_tanggal_pengiriman: Joi.string().required().messages({
    "string.empty": "Tanggal dan waktu pengiriman wajib diisi.",
    "any.required": "Tanggal dan waktu pengiriman wajib diisi.",
  }),
});

module.exports = {
  createPesananDetailSchema,
  createPesananSchema,
};
