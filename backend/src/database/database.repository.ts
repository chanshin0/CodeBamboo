import { DataSource } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Follow } from 'src/users/entities/follow.entity';
import { Bookmark } from 'src/users/entities/bookmark.entity';
import { Like } from 'src/users/entities/like.entity';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: process.env.MYSQL_URL,
        port: parseInt(process.env.MYSQL_PORT),
        username: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        entities: [User, Follow, Bookmark, Like],
        synchronize: false,
      });

      return dataSource.initialize();
    },
  },
];
