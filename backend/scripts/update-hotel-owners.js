const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const config = require('../config');

/**
 * Script to update owner IDs for existing hotels in the database
 * This is useful when you need to assign hotels to a specific owner
 */
const updateHotelOwners = async () => {
    try {
        await mongoose.connect(config.mongoURI);
        console.log('Connected to MongoDB');

        // Owner ID to assign to hotels
        const ownerId = "1ZN9NxYGozUbFAudlXoyloyfnhL2";

        // Update all hotels that don't have an owner ID
        const result = await Hotel.updateMany(
            { ownerId: { $exists: false } },
            { $set: { ownerId: ownerId } }
        );

        console.log(`Updated ${result.modifiedCount} hotels with owner ID: ${ownerId}`);

        // Alternatively, update specific hotels by name
        // Uncomment and modify as needed
        /*
        const hotelNames = ["Mandarin Oriental", "Le Royal Monceau"];
        
        for (const name of hotelNames) {
          const result = await Hotel.updateOne(
            { name: name },
            { $set: { ownerId: ownerId } }
          );
          
          console.log(`Hotel "${name}": ${result.modifiedCount} updated`);
        }
        */

        // List all hotels with their owner IDs
        const hotels = await Hotel.find({}, 'name ownerId');
        console.log('\nHotel ownership status:');
        hotels.forEach(hotel => {
            console.log(`- ${hotel.name}: ${hotel.ownerId || 'No owner'}`);
        });

        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    } catch (error) {
        console.error('Error updating hotel owners:', error);
        process.exit(1);
    }
};

updateHotelOwners(); 