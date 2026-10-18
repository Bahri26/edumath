import {afterEach,expect,it,vi} from 'vitest';
afterEach(()=>{vi.unstubAllEnvs();vi.resetModules();});
it('routes uploaded and bundled images to the API even if the asset host is stale',async()=>{
 vi.stubEnv('VITE_API_URL','https://active-api.example.com/api');vi.stubEnv('VITE_ASSET_BASE_URL','https://old-api.example.com');vi.resetModules();
 const {resolveAssetUrl}=await import('./api.js');
 expect(resolveAssetUrl('/uploads/pattern-pdf-source/6-sinif/source-p08-q03.png')).toBe('https://active-api.example.com/uploads/pattern-pdf-source/6-sinif/source-p08-q03.png');
 expect(resolveAssetUrl('uploads/generated/question.svg')).toBe('https://active-api.example.com/uploads/generated/question.svg');
 expect(resolveAssetUrl('https://drive.google.com/example')).toBe('https://drive.google.com/example');
});
