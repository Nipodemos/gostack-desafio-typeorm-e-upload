// import AppError from '../errors/AppError';
import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';
import CreateOrGetCategoryService from './CreateOrGetCategoryService';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Incorrect Transaction type');
    }
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && total - value < 0) {
      throw new AppError(
        'You dont have enough money to complete this transaction',
      );
    }
    const newCategory = await new CreateOrGetCategoryService().execute({
      categoryName: category,
    });
    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: newCategory,
    });
    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
