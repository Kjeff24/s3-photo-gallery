import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Photo = sequelize.define('Photo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add a title',
      },
      len: {
        args: [1, 100],
        msg: 'Title cannot be more than 100 characters',
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add a description',
      },
      len: {
        args: [1, 500],
        msg: 'Description cannot be more than 500 characters',
      },
    },
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Please add an image URL',
      },
    },
  },
  s3Key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  camera: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'photos',
  timestamps: true,
  indexes: [
    {
      type: 'FULLTEXT',
      name: 'photo_search_idx',
      fields: ['title', 'description'],
    },
  ],
});

export default Photo;
