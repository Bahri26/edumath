const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {registerPatternSourceImages}=require('../../utils/patternSourceImages');
test('bundled PDF images are registered in production and resolve inside the source directory',()=>{
 let handler;registerPatternSourceImages({get:(route,fn)=>{assert.equal(route,'/uploads/pattern-pdf-source/:grade/:file');handler=fn;}});
 let target,cache;handler({params:{grade:'6-sinif',file:'source-p08-q03.png'}},{set:(key,value)=>cache=value,sendFile:file=>target=file});
 assert.ok(cache.includes('max-age'));assert.ok(target.startsWith(path.resolve(__dirname,'../../data/pattern-pdf-import')));assert.deepEqual([...fs.readFileSync(target).subarray(0,4)],[137,80,78,71]);
 for(const [grade,file] of [['../','source-p08-q03.png'],['6-sinif','../../.env'],['1-sinif','source-p01-q01.png']]){let status;handler({params:{grade,file}},{sendStatus:code=>status=code});assert.equal(status,404);}
});
