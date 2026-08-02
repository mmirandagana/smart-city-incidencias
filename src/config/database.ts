import sqlite3 from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Patrón de Diseño Singleton para la gestión única de la conexión a la base de datos SQLite.
 */
export class Database {
  private static instance: Database | null = null;
  private db: sqlite3.Database;
  private isReadyPromise: Promise<void>;

  private constructor() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
    const sqlite = sqlite3.verbose();
    
    this.db = new sqlite.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error al conectar con la base de datos SQLite:', err.message);
      } else {
        console.log(`⚡ Conexión exitosa a SQLite Singleton [DB: ${dbPath}]`);
      }
    });

    this.isReadyPromise = this.initSchema();
  }

  /**
   * Obtiene la instancia única (Singleton) de Database.
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Garantiza que la tabla de la base de datos haya sido creada antes de ejecutar consultas.
   */
  public ready(): Promise<void> {
    return this.isReadyPromise;
  }

  /**
   * Inicializa la tabla de incidencias en SQLite si no existe.
   */
  private initSchema(): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        CREATE TABLE IF NOT EXISTS incidencias (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          titulo TEXT NOT NULL,
          categoria TEXT NOT NULL CHECK(categoria IN ('Bache', 'Luminaria', 'Semáforo', 'Basura/Aseo')),
          descripcion TEXT NOT NULL,
          latitud REAL NOT NULL,
          longitud REAL NOT NULL,
          estado TEXT NOT NULL DEFAULT 'Ingresado' CHECK(estado IN ('Ingresado', 'Asignado', 'En Reparación', 'Resuelto')),
          prioridad TEXT NOT NULL DEFAULT 'Media' CHECK(prioridad IN ('Baja', 'Media', 'Alta', 'Crítica')),
          foto_url TEXT,
          creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      this.db.run(query, (err) => {
        if (err) {
          console.error('❌ Error al inicializar el esquema de la base de datos:', err.message);
          reject(err);
        } else {
          console.log('✅ Esquema de base de datos verificado e inicializado correctamente.');
          resolve();
        }
      });
    });
  }

  /**
   * Wrapper promisificado para db.run (INSERT, UPDATE, DELETE).
   */
  public async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    await this.ready();
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Wrapper promisificado para db.get (SELECT single row).
   */
  public async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    await this.ready();
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T | undefined);
        }
      });
    });
  }

  /**
   * Wrapper promisificado para db.all (SELECT multiple rows).
   */
  public async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    await this.ready();
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  /**
   * Cierra la conexión a la base de datos.
   */
  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
