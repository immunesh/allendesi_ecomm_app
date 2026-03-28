const pool = require("../config/db");

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

const getRecommendationProducts = async (req, res) => {
  try {
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
        ORDER BY p.ratings DESC, p.created_at DESC
        LIMIT 10
      `,
    );

    return res.status(200).json({
      success: true,
      recommendations: rows.map(mapProductRow),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommendations",
      error: error.message,
    });
  }
};

module.exports = {
  getRecommendationProducts,
};
