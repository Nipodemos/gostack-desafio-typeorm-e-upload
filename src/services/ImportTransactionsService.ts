import fs from 'fs';
import path from 'path';

import { getCustomRepository, getRepository, In } from 'typeorm';
import { Parser } from 'csv-parse';
import uploadConfig from '../config/uploads';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface RequestDTO {
  filename: string;
}

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  categoryName: string;
}

class ImportTransactionsService {
  async execute({ filename }: RequestDTO): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const readCsvStream = fs.createReadStream(
      path.resolve(uploadConfig.directory, filename),
    );

    const parseStream = new Parser({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });
    const parseCSV = readCsvStream.pipe(parseStream);

    const categories: string[] = [];
    const transactions: TransactionDTO[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, categoryName] = line;

      if (!title || !type || !value || !categoryName) return;

      transactions.push({ title, type, value, categoryName });
      categories.push(categoryName);
    });
    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });
    console.log('transactions :>> ', transactions);
    console.log('categories :>> ', categories);

    const categoriesRepository = getRepository(Category);
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      category => category.title,
    );

    const addCategoriesTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    console.log('addCategoriesTitles :>> ', addCategoriesTitles);
    let newCategories: Category[] = [];
    if (addCategoriesTitles.length > 0) {
      newCategories = categoriesRepository.create(
        addCategoriesTitles.map(title => ({ title })),
      );
      newCategories = await categoriesRepository.save(newCategories);
    }

    const finalCategories = [...existentCategories, ...newCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.categoryName,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(path.resolve(uploadConfig.directory, filename));

    return createdTransactions;
  }
}

export default ImportTransactionsService;
