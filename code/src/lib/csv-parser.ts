import Papa from 'papaparse';
import { Mentor, Mentee } from '@/types/matching';

export function parseMentorCSV(file: File): Promise<Mentor[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as string[][];
          // Skip header row
          const mentors = data.slice(1).map(row => ({
            id: row[0] || '',
            levelOfStudies: row[1] || '',
            birthYear: parseInt(row[5]) || 0,
            gender: row[6] || '',
            nationality: row[8] || '',
            city: row[9] || '',
            germanLevel: row[10] || '',
            englishLevel: row[11] || '',
            otherLanguages: row[13] || ''
          })).filter(m => m.id); // Filter out empty rows
          
          resolve(mentors);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export function parseMenteeCSV(file: File): Promise<Mentee[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as string[][];
          // Skip header row
          const mentees = data.slice(1).map(row => ({
            id: row[0] || '',
            birthYear: parseInt(row[1]) || 0,
            desiredGender: row[4] || '',
            englishLevel: row[5] || '',
            otherLanguages: row[12] || '',
            gender: row[13] || '',
            germanLevel: row[14] || '',
            nationality: row[18] || '',
            levelOfStudies: row[20] || '',
            city: row[25] || ''
          })).filter(m => m.id); // Filter out empty rows
          
          resolve(mentees);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}
