import { useEffect, useRef } from 'react';
import { TransactionHash } from '@elrondnetwork/erdjs/out';
import { useDispatch, useSelector } from 'redux/DappProviderContext';
import { apiProviderSelector } from 'redux/selectors/networkConfigSelectors';
import {
  updateSignedTransactions,
  updateSignedTransactionStatus
} from 'redux/slices';
import {
  TransactionBatchStatusesEnum,
  TransactionServerStatusesEnum
} from 'types/enums';
import { SignedTransactionsBodyType } from 'types/transactions';
import { getIsTransactionPending, getPlainTransactionStatus } from 'utils';
import { refreshAccount } from 'utils/account';

interface RetriesType {
  [hash: string]: number;
}

interface TransactionStatusTrackerPropsType {
  sessionId: string;
  transactionPayload: SignedTransactionsBodyType;
}

export function TransactionStatusTracker({
  sessionId,
  transactionPayload: { transactions, status }
}: TransactionStatusTrackerPropsType) {
  const dispatch = useDispatch();
  const intervalRef = useRef<any>(null);
  const isFetchingStatusRef = useRef(false);
  const retriesRef = useRef<RetriesType>({});
  const apiProvider = useSelector(apiProviderSelector);

  const isPending = sessionId != null && getIsTransactionPending(status);
  const manageTimedOutTransactions = () => {
    dispatch(
      updateSignedTransactions({
        sessionId,
        status: TransactionBatchStatusesEnum.timedOut
      })
    );
  };

  const checkTransactionStatus = async () => {
    try {
      if (!isPending || transactions == null) {
        return;
      }
      isFetchingStatusRef.current = true;
      for (const { hash, status } of transactions) {
        if (hash == null || !getIsTransactionPending(status)) {
          return;
        }
        try {
          const retriesForThisHash = retriesRef.current[hash];
          if (retriesForThisHash > 40) {
            // consider transaction as stuck after 10 seconds
            manageTimedOutTransactions();
            return;
          }
          const txOnNetwork = await apiProvider.getTransaction(
            new TransactionHash(hash)
          );
          if (txOnNetwork != null) {
            if (!txOnNetwork.status.isPending()) {
              const status = getPlainTransactionStatus(txOnNetwork.status);
              dispatch(
                updateSignedTransactionStatus({
                  sessionId,
                  status,
                  transactionHash: hash
                })
              );

              refreshAccount();

              if (txOnNetwork.status.isFailed()) {
                const scResults = txOnNetwork
                  .getSmartContractResults()
                  .getAllResults();
                const resultWithError = scResults.find(
                  (scResult) => scResult.getReturnMessage() !== ''
                );

                dispatch(
                  updateSignedTransactionStatus({
                    transactionHash: hash,
                    sessionId,
                    status: TransactionServerStatusesEnum.failed,
                    errorMessage: resultWithError?.getReturnMessage()
                  })
                );
                dispatch(
                  updateSignedTransactions({
                    sessionId,
                    status: TransactionBatchStatusesEnum.failed,
                    errorMessage: resultWithError?.getReturnMessage()
                  })
                );
              }
            } else {
              retriesRef.current[hash] = retriesRef.current[hash]
                ? retriesRef.current[hash] + 1
                : 1;
            }
          } else {
            retriesRef.current[hash] = retriesRef.current[hash]
              ? retriesRef.current[hash] + 1
              : 1;
          }
        } catch (error) {
          console.error(error);
          manageTimedOutTransactions();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isPending) {
      intervalRef.current = setInterval(() => {
        checkTransactionStatus();
      }, 2000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [isPending]);
  return null;
}

export default TransactionStatusTracker;
