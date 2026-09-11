import { ApiError, ok } from "../utils/http.js";

export function createCrudController(
  Model,
  { populate = "", searchFields = [] } = {},
) {
  return {
    async list(req, res) {
      const filter = {};
      if (req.query.q && searchFields.length) {
        filter.$or = searchFields.map((field) => ({
          [field]: { $regex: req.query.q, $options: "i" },
        }));
      }

      let query = Model.find(filter).sort({ createdAt: -1 });
      if (populate) query = query.populate(populate);
      const items = await query.lean();
      return ok(res, { items, total: items.length });
    },

    async get(req, res) {
      let query = Model.findById(req.params.id);
      if (populate) query = query.populate(populate);
      const item = await query.lean();
      if (!item) throw new ApiError(404, `${Model.modelName} not found.`);
      return ok(res, item);
    },

    async create(req, res) {
      const item = await Model.create(req.body);
      return ok(res, item, `${Model.modelName} created.`, 201);
    },

    async update(req, res) {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!item) throw new ApiError(404, `${Model.modelName} not found.`);
      return ok(res, item, `${Model.modelName} updated.`);
    },

    async remove(req, res) {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) throw new ApiError(404, `${Model.modelName} not found.`);
      return ok(res, { id: item._id }, `${Model.modelName} deleted.`);
    },
  };
}
