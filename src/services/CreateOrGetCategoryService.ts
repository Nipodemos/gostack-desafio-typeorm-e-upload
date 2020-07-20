import { getRepository } from 'typeorm';
import Category from '../models/Category';

class CreateOrGetCategoryService {
  public async execute({
    categoryName,
  }: {
    categoryName: string;
  }): Promise<Category> {
    const categoryRepository = getRepository(Category);

    let newCategory = await categoryRepository.findOne({ title: categoryName });
    console.log('newCategory :>> ', newCategory);
    if (!newCategory) {
      console.log(`creating new category ${newCategory}`);
      const categoryInstance = categoryRepository.create({
        title: categoryName,
      });
      newCategory = await categoryRepository.save(categoryInstance);
    }
    return newCategory;
  }
}

export default CreateOrGetCategoryService;
