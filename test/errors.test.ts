import { describe, it, expect } from 'vitest';
import {
  QpdfError,
  QpdfInitError,
  QpdfCompressionError,
  QpdfValidationError,
} from '../src/core/errors.js';

describe('Error Classes', () => {
  describe('QpdfError', () => {
    it('should create error with message', () => {
      const error = new QpdfError('test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(QpdfError);
      expect(error.message).toBe('test error');
      expect(error.name).toBe('QpdfError');
    });

    it('should support error cause', () => {
      const cause = new Error('underlying error');
      const error = new QpdfError('test error', { cause });
      expect(error.cause).toBe(cause);
    });

    it('should work with instanceof', () => {
      const error = new QpdfError('test');
      expect(error instanceof QpdfError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('QpdfInitError', () => {
    it('should create init error', () => {
      const error = new QpdfInitError('init failed');
      expect(error).toBeInstanceOf(QpdfInitError);
      expect(error).toBeInstanceOf(QpdfError);
      expect(error.name).toBe('QpdfInitError');
    });
  });

  describe('QpdfCompressionError', () => {
    it('should create compression error', () => {
      const error = new QpdfCompressionError('compression failed');
      expect(error).toBeInstanceOf(QpdfCompressionError);
      expect(error).toBeInstanceOf(QpdfError);
      expect(error.name).toBe('QpdfCompressionError');
    });
  });

  describe('QpdfValidationError', () => {
    it('should create validation error', () => {
      const error = new QpdfValidationError('invalid input');
      expect(error).toBeInstanceOf(QpdfValidationError);
      expect(error).toBeInstanceOf(QpdfError);
      expect(error.name).toBe('QpdfValidationError');
    });
  });
});
