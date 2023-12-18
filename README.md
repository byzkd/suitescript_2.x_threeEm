# suitescript_2.x_threeEm
Map/Reduce Script - Update Item Rec 

Test Task 1:

Create a map/reduce script to load all the items.
Initially authenticate a sample OAuth call to http://samplecall.com/authenticate. 
Save the access token along with its expiry. Additionally, for each item, make a sample call to http://samplecall.com/items/ItemNo and retrieve the price as a response and update item price at the end of the script i should have list of items has been updated.
Please ensure to include client ID, client secret, and other necessary information.

This script:

1-	Loads all inventory items using a search in the getInputData function.
2-	In the map function, it fetches the item price, and emits the relevant information for reduction.
3-	In the reduce function, it loads each inventory item, updates the vendor price sublist based on the updatedPrice, and saves the item record.

