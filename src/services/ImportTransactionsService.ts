import fs from 'fs';
import csv from 'csv-parse/lib/sync';
import parser from 'csv-parser';
import path from 'path';
import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateOrGetCategoryService from './CreateOrGetCategoryService';

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
    const data: TransactionDTO[] = [];
    const transactions: Transaction[] = [];
    fs.createReadStream(path.resolve(__dirname, '..', '..', 'tmp', filename))
      .pipe(parser())
      .on('data', row => {
        console.log('row :>> ', row);
        data.push({
          title: row.title,
          type: row.type,
          value: row.value,
          categoryName: row.category,
        });
      })
      .on('end', () => {
        console.log('data inside onEnd :>> ', data);
        console.log('CSV file successfully processed');
      });

    console.log('data :>> ', data);
    data.forEach(
      async ({ title, type, value, categoryName }: TransactionDTO) => {
        const category = await new CreateOrGetCategoryService().execute({
          categoryName,
        });
        const transaction = transactionsRepository.create({
          title,
          type,
          value,
          category,
        });
        const savedTransaction = await transactionsRepository.save(transaction);
        transactions.push(savedTransaction);
      },
    );
    console.log('transactions :>> ', transactions);
    return transactions;
  }
}

export default ImportTransactionsService;
