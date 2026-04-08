const pool = require("../config/db");

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.max(1, Math.min(50, Number(query.limit || 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const getFallbackProductImage = (productId) =>
  `https://picsum.photos/seed/product-${productId}/600/600`;

const mapProductRow = (row) => {
  const imageUrl = row.image_url || getFallbackProductImage(row.id);
  const imageFileId = row.image_file_id || "";

  return {
    id: row.id,
    title: row.title,
    regular_price: Number(row.regular_price),
    sale_price: row.sale_price !== null ? Number(row.sale_price) : null,
    ratings: Number(row.ratings || 0),
    reviews: Array.from({ length: Number(row.review_count || 0) }, () => ({})),
    images: [
      {
        url: imageUrl,
        file_id: imageFileId,
      },
    ],
    Shop: {
      id: row.shop_id,
      name: row.shop_name,
      avatar: row.shop_avatar,
      rating: Number(row.shop_rating || 0),
    },
  };
};

const getAllProducts = async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query);

    const [rows] = await pool.execute(
      `
        SELECT
          p.id,
          p.title,
          p.regular_price,
          p.sale_price,
          p.ratings,
          s.id AS shop_id,
          s.name AS shop_name,
          s.avatar AS shop_avatar,
          s.rating AS shop_rating,
          MIN(pi.url) AS image_url,
          MIN(pi.file_id) AS image_file_id,
          0 AS review_count
        FROM products p
        JOIN shops s ON s.id = p.shop_id
        LEFT JOIN product_images pi ON pi.product_id = p.id
        GROUP BY
          p.id,
          p.title,
          p.regular_price,
          p.sale_price,
          p.ratings,
          s.id,
          s.name,
          s.avatar,
          s.rating
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [limit, offset],
    );

    return res.status(200).json({
      success: true,
      page,
      limit,
      products: rows.map(mapProductRow),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

const getTopShops = async (req, res) => {
  try {
    const [shops] = await pool.execute(
      `
        SELECT id, name, avatar, cover_image, rating, created_at
        FROM shops
        ORDER BY rating DESC, created_at DESC
        LIMIT 10
      `,
    );

    return res.status(200).json({
      success: true,
      shops,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch top shops",
      error: error.message,
    });
  }
};

const getFilteredProducts = async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const [minPriceRaw, maxPriceRaw] = String(req.query.priceRange || "0,999999")
      .split(",")
      .map((value) => Number(value));

    const minPrice = Number.isFinite(minPriceRaw) ? minPriceRaw : 0;
    const maxPrice = Number.isFinite(maxPriceRaw) ? maxPriceRaw : 999999;

    const [countRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM products p
        WHERE COALESCE(p.sale_price, p.regular_price) BETWEEN ? AND ?
      `,
      [minPrice, maxPrice],
    );

    const total = Number(countRows?.[0]?.total || 0);

    const [rows] = await pool.execute(
      `
        SELECT
          p.id,
          p.title,
          p.regular_price,
          p.sale_price,
          p.ratings,
          s.id AS shop_id,
          s.name AS shop_name,
          s.avatar AS shop_avatar,
          s.rating AS shop_rating,
          MIN(pi.url) AS image_url,
          MIN(pi.file_id) AS image_file_id,
          0 AS review_count
        FROM products p
        JOIN shops s ON s.id = p.shop_id
        LEFT JOIN product_images pi ON pi.product_id = p.id
        WHERE COALESCE(p.sale_price, p.regular_price) BETWEEN ? AND ?
        GROUP BY
          p.id,
          p.title,
          p.regular_price,
          p.sale_price,
          p.ratings,
          s.id,
          s.name,
          s.avatar,
          s.rating
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [minPrice, maxPrice, limit, offset],
    );

    return res.status(200).json({
      success: true,
      products: rows.map(mapProductRow),
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch filtered products",
      error: error.message,
    });
  }
};

const searchProducts = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(200).json({
        success: true,
        products: [],
      });
    }

    const likeQuery = `%${query}%`;
    const [rows] = await pool.execute(
      `
        SELECT
          p.id,
          p.title,
          p.regular_price,
          p.sale_price,
          p.ratings,
          s.id AS shop_id,
          s.name AS shop_name,
          s.avatar AS shop_avatar,
          s.rating AS shop_rating,
          MIN(pi.url) AS image_url,
          MIN(pi.file_id) AS image_file_id,
          0 AS review_count
        FROM products p
        JOIN shops s ON s.id = p.shop_id
        LEFT JOIN product_images pi ON pi.product_id = p.id
        WHERE p.title LIKE ?
        GROUP BY
          p.id,
          p.title,
          p.regular_price,
          p.sale_price,
          p.ratings,
          s.id,
          s.name,
          s.avatar,
          s.rating
        ORDER BY p.created_at DESC
        LIMIT 50
      `,
      [likeQuery],
    );

    return res.status(200).json({
      success: true,
      products: rows.map(mapProductRow),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to search products",
      error: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: "Product id is required" });
  }

  try {
    const [rows] = await pool.execute(
      `
      SELECT
        p.id,
        p.title,
        p.regular_price,
        p.sale_price,
        p.ratings,
        p.description,
        s.id AS shop_id,
        s.name AS shop_name,
        s.avatar AS shop_avatar,
        s.rating AS shop_rating,
        GROUP_CONCAT(pi.url) AS image_urls,
        GROUP_CONCAT(pi.file_id) AS image_file_ids
      FROM products p
      JOIN shops s ON s.id = p.shop_id
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE p.id = ? OR p.slug = ?
      GROUP BY p.id, p.title, p.regular_price, p.sale_price, p.ratings, p.description, s.id, s.name, s.avatar, s.rating
      `,
      [id, id],
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = rows[0];
    const images = product.image_urls
      ? product.image_urls.split(",").map((url) => ({ url }))
      : [{ url: getFallbackProductImage(product.id) }];

    const mappedProduct = {
      ...mapProductRow({
        ...product,
        image_url: images[0]?.url,
        image_file_id: product.image_file_ids?.split(",")[0] || "",
      }),
      description: product.description,
      images,
    };

    return res.status(200).json({ success: true, product: mappedProduct });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getFilteredProducts,
  getProductById,
  searchProducts,
  getTopShops,
};
