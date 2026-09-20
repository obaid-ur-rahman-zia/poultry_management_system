import useSWR from 'swr';
import { fetcher } from './fetcher';

export function useAccounts() {
  const { data, error, isLoading, mutate } = useSWR('/api/account/accounts/readAll?all=true', fetcher);

  let accounts = [];
  if (data?.response_status === "success" || data?.response_code === 200 || data?.success) {
    if (data?.response_result?.data) accounts = data.response_result.data;
    else if (data?.response_result) accounts = data.response_result;
    else if (data?.data) accounts = data.data;
  }
  if (!Array.isArray(accounts)) accounts = [];

  return {
    accounts,
    isLoading,
    isError: error,
    mutate
  };
}

export function useSubHeads() {
  const { data, error, isLoading, mutate } = useSWR('/api/account/accountSubHead/readAll', fetcher);

  let subHeads = [];
  if (data?.response_status === "success" || data?.response_code === 200 || data?.success) {
    if (data?.response_result?.data) subHeads = data.response_result.data;
    else if (data?.response_result) subHeads = data.response_result;
    else if (data?.data) subHeads = data.data;
  }
  if (!Array.isArray(subHeads)) subHeads = [];

  return {
    subHeads,
    isLoading,
    isError: error,
    mutate
  };
}
