using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace InsuranceApi.Services
{
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(IFormFile file, string subFolder);
        void DeleteFile(string filePath);
    }

    public class FileStorageService : IFileStorageService
    {
        private readonly string _uploadFolder;

        public FileStorageService()
        {
            _uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(_uploadFolder))
            {
                Directory.CreateDirectory(_uploadFolder);
            }
        }

        public async Task<string> SaveFileAsync(IFormFile file, string subFolder)
        {
            var targetFolder = Path.Combine(_uploadFolder, subFolder);
            if (!Directory.Exists(targetFolder))
            {
                Directory.CreateDirectory(targetFolder);
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(targetFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Path.Combine("uploads", subFolder, uniqueFileName).Replace("\\", "/");
        }

        public void DeleteFile(string filePath)
        {
            // Convert database relative path back to absolute path
            var cleanRelative = filePath.Replace("uploads/", "").Replace("uploads\\", "");
            var fullPath = Path.Combine(_uploadFolder, cleanRelative);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }
    }
}
