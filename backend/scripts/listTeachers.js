#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function main(){
  try{
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edumathDB';
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    const teachers = await User.find({ role: 'teacher' }).select('email name branch').lean();
    if(!teachers.length){
      console.log('No teachers found.');
    } else {
      console.log('Teachers:');
      teachers.forEach(t => console.log(`- ${t.name || '(no name)'} <${t.email}> ${t.branch ? '('+t.branch+')' : ''}`));
    }
  } catch(err){
    console.error('Error listing teachers:', err.message);
  } finally {
    try{ await mongoose.connection.close(); } catch{}
  }
}

main();
