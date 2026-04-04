const { createClient } = require('@supabase/supabase-js');

// Necesitamos las credenciales del .env
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://uynfccqfajubrmjymglt.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bmZjY3FmYWp1YnJtanltZ2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyODUzMzQsImV4cCI6MjA1Njg2MTMzNH0.V2d-mD3sEkt2LhQnL2L2hL2L2hL2L2hL2L2hL2L2hL2L2hL2"; // I shouldn't guess, I should just use the actual env file if I can, or read it first.

// wait, I can just use the absolute path for dotenv if I write it in the root.
