import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: RequestDTO): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const transaction = await transactionRepository.findOne({ id });

    if (!transaction) {
      throw new AppError(
        'The transaction you are trying to delete does not exist',
      );
    }

    await transactionRepository.delete({ id });
  }
}

export default DeleteTransactionService;
