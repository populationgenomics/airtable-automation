/* An AirTable automation script that updates the Manifest Table 
with details provided in the CSV file table. It effectively acts as a lookup
with some additional validation steps. 
*/

// Logging statements to provide useful feedback in airtable 
console.log('Starting Update');

// Pull the records in the Manifest and CSV file tables.
let manifest_table = base.getTable('Manifest');
let manifest_records = await manifest_table.selectRecordsAsync();

let csv_table = base.getTable('CSV file');
let csv_records = await csv_table.selectRecordsAsync();

// Validate unique csv values 
let ids_in_csv = csv_records.records.map(a => a.name.trim());
if (new Set(ids_in_csv).size !== ids_in_csv.length){
    throw new Error('Duplicate detected in CSV table. Please fix this error and run the script again.');
}

// Iterate through each row in the CSV file table
for (let updated_record of csv_records.records) {
    let curr_sample = updated_record.getCellValue('Sample ID1');
    console.log('Updating ' + curr_sample);

    // Empty sample ID
    if (curr_sample === null) {
        throw new Error(
        'There is a row in the CSV file that does not have a Sample ID. Please fix this error and run the script again.'
        );
    }

    /* Get the matching record in the main Manifest table 
    The updateRecord function requires an object of type Record
    At present a 'getRecord' function is not supported, so this step, 
    although inefficient, seems to be required.  */ 

    var matched_record = manifest_records.records.filter((obj) => {
        return obj.getCellValue('Sample ID') === curr_sample;
    });

    // Check for duplicate record found in manifest table 
    if (matched_record.length > 1) {
        throw new Error(
        curr_sample +
            ' duplicate detected in Manifest Table. Please fix this error and run the script again.'
        );
    }

    let manifest_row = matched_record[0];
    
    // Check row exists in original manifest
    if (manifest_row === undefined) {
        throw new Error(
        curr_sample +
            ' was listed in the new CSV but it could not be found in the original Manifest. Please fix this error and run the script again.'
        );
    }

    // Pull values to transfer 
    let fluidX_tube = updated_record.getCellValue('KCCG FluidX tube ID1');
    let concentration = updated_record.getCellValue(
        'FD tube conc after robot dilution IQC (ng/ul) '
    );
    let volume = updated_record.getCellValue(
        'Vol left in FD tube after 80ul transfer to DNA plate (ul) '
    );
    let ng = updated_record.getCellValue('ng available1');
    let comment = updated_record.getCellValue('comment');


    // Update Record
    await manifest_table.updateRecordAsync(manifest_row{
        'KCCG FluidX tube ID': fluidX_tube,
        'Concentration (ng/ul)*': concentration,
        'Volume (ul)*': volume,
        'ng available': ng,
        'comments': comment,
    });
}

console.log('Update complete!');
