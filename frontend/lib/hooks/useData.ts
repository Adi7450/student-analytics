"use client";
import { useQuery } from "@tanstack/react-query";
import {
  fetchStats, fetchProbability, fetchSampling,
  fetchHypothesis, fetchSolutions,
} from "../api";

const STALE = 1000 * 60 * 5; // 5 min

export const useStats       = () => useQuery({ queryKey: ["stats"],       queryFn: fetchStats,       staleTime: STALE, retry: 1 });
export const useProbability = () => useQuery({ queryKey: ["probability"], queryFn: fetchProbability, staleTime: STALE, retry: 1 });
export const useSampling    = () => useQuery({ queryKey: ["sampling"],    queryFn: fetchSampling,    staleTime: STALE, retry: 1 });
export const useHypothesis  = () => useQuery({ queryKey: ["hypothesis"],  queryFn: fetchHypothesis,  staleTime: STALE, retry: 1 });
export const useSolutions   = () => useQuery({ queryKey: ["solutions"],   queryFn: fetchSolutions,   staleTime: STALE, retry: 1 });
