import { FastifyRequest, FastifyReply } from 'fastify';
import { sendSuccess, sendError, sendNotFound, sendServerError } from '../../utils/response';
import { uploadFile } from '../../config/aws';
import * as categoryService from './category.service';

export async function createCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    let categoryName: string | undefined;
    let description: string | undefined;
    let image: string | undefined;

    if (request.isMultipart()) {
      const data = await request.file();
      if (!data) return sendError(reply, 'Invalid multipart data', 400);
      const fields = data.fields as Record<string, any>;
      categoryName = fields.categoryName?.value;
      description = fields.description?.value;
      const buffer = await data.toBuffer();
      if (buffer && buffer.length > 0) {
        const url = await uploadFile(buffer, data.mimetype, 'categories');
        if (url) image = url;
      }
    } else {
      const body = request.body as any;
      categoryName = body.categoryName;
      description = body.description;
      image = body.image || undefined;
    }

    if (!categoryName) return sendError(reply, 'categoryName is required', 400);

    const category = await categoryService.create({ categoryName, description, image });
    return sendSuccess(reply, category, 'Category created', 201);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function listCategoriesAdmin(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const categories = await categoryService.getAllAdmin();
    return sendSuccess(reply, categories);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getCategoryByIdAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const category = await categoryService.getByIdAdmin(parseInt(id));
    if (!category) return sendNotFound(reply, 'Category not found');
    return sendSuccess(reply, category);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function updateCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const existing = await categoryService.getByIdAdmin(parseInt(id));
    if (!existing) return sendNotFound(reply, 'Category not found');

    let categoryName: string | undefined;
    let description: string | undefined;
    let image: string | undefined;

    if (request.isMultipart()) {
      const data = await request.file();
      if (!data) return sendError(reply, 'Invalid multipart data', 400);
      const fields = data.fields as Record<string, any>;
      categoryName = fields.categoryName?.value;
      description = fields.description?.value;
      const buffer = await data.toBuffer();
      if (buffer && buffer.length > 0) {
        const url = await uploadFile(buffer, data.mimetype, 'categories');
        if (url) image = url;
      }
    } else {
      const body = request.body as any;
      categoryName = body.categoryName;
      description = body.description;
      image = body.image || undefined;
    }

    const category = await categoryService.update(parseInt(id), { categoryName, description, image }, existing.image);
    return sendSuccess(reply, category, 'Category updated');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function deleteCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    await categoryService.remove(parseInt(id));
    return sendSuccess(reply, null, 'Category deleted');
  } catch (error: any) {
    if (error.message === 'Category not found') return sendNotFound(reply, 'Category not found');
    if (error.message === 'Cannot delete category with existing products') {
      return sendError(reply, error.message, 400);
    }
    return sendServerError(reply, error);
  }
}

export async function listCategoriesPublic(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const categories = await categoryService.getAllPublic();
    return sendSuccess(reply, categories);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getCategoryByIdPublic(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const category = await categoryService.getByIdPublic(parseInt(id));
    if (!category) return sendNotFound(reply, 'Category not found');
    return sendSuccess(reply, category);
  } catch (error) {
    return sendServerError(reply, error);
  }
}
