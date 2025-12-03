// // app/repositories/baseRepository.js
// import prisma from "@/lib/prisma";

// export default class BaseRepository {
//   constructor(model) {
//     if (!model) throw new Error("Model name must be provided");
//     this.model = model;
//   }

//   async readAll(select, orderBy = { id: "asc" }) {
//     return prisma[this.model].findMany({ select, orderBy });
//   }

//   async readById(id, select) {
//     return prisma[this.model].findUnique({
//       where: { [`${this.model}_id`]: Number(id) },
//       select,
//     });
//   }

//   async readNextId(fieldName = `${this.model}_id`) {
//     const maxId = await prisma[this.model].aggregate({
//       _max: { [fieldName]: true },
//     });
//     return (maxId._max[fieldName] || 0) + 1;
//   }

//   async create(data) {
//     return prisma[this.model].create({ data });
//   }

//   async update(id, data) {
//     return prisma[this.model].update({
//       where: { [`${this.model}_id`]: Number(id) },
//       data,
//     });
//   }

//   async delete(id) {
//     return prisma[this.model].delete({
//       where: { [`${this.model}_id`]: Number(id) },
//     });
//   }
// }
