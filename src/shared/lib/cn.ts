import { clsx, type ClassValue } from 'clsx';

/** 조건부 클래스 이름을 합친다. */
export const cn = (...inputs: ClassValue[]) => clsx(inputs);
