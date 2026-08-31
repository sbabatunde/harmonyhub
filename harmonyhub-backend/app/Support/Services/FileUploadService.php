<?php

namespace App\Support\Services;

use App\Support\Services\Contracts\FileUploadServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileUploadService implements FileUploadServiceInterface
{
  /**
   * Upload a file to the specified directory.
   */
  public function upload(UploadedFile $file, string $directory, string $disk = 'public'): string
  {
    $filename = $this->generateUniqueFilename($file);
    $path = $file->storeAs($directory, $filename, $disk);

    return $path;
  }

  /**
   * Upload multiple files.
   */
  public function uploadMultiple(array $files, string $directory, string $disk = 'public'): array
  {
    $paths = [];

    foreach ($files as $file) {
      if ($file instanceof UploadedFile) {
        $paths[] = $this->upload($file, $directory, $disk);
      }
    }

    return $paths;
  }

  /**
   * Delete a file from storage.
   */
  public function delete(string $path, string $disk = 'public'): bool
  {
    if (Storage::disk($disk)->exists($path)) {
      return Storage::disk($disk)->delete($path);
    }

    return false;
  }

  /**
   * Delete multiple files from storage.
   */
  public function deleteMultiple(array $paths, string $disk = 'public'): bool
  {
    foreach ($paths as $path) {
      $this->delete($path, $disk);
    }

    return true;
  }

  /**
   * Get the URL for a file.
   */
  public function getUrl(string $path, string $disk = 'public'): string
  {
    return Storage::disk($disk)->url($path);
  }

  /**
   * Check if a file exists.
   */
  public function exists(string $path, string $disk = 'public'): bool
  {
    return Storage::disk($disk)->exists($path);
  }

  /**
   * Generate a unique filename.
   */
  private function generateUniqueFilename(UploadedFile $file): string
  {
    $extension = $file->getClientOriginalExtension();
    $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
    $slug = strtolower(str_replace(' ', '-', $originalName));
    $timestamp = now()->timestamp;
    $random = substr(uniqid(), -6);

    return "{$slug}-{$timestamp}-{$random}.{$extension}";
  }
}
