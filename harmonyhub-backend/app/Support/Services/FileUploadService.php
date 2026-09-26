<?php

namespace App\Support\Services;

use App\Support\Services\Contracts\FileUploadServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileUploadService implements FileUploadServiceInterface
{
  /**
   * Resolve the disk to use. Prefers the explicitly passed disk,
   * falls back to the app's configured default (R2 in production).
   */
  private function resolveDisk(?string $disk): string
  {
    return $disk ?? config('filesystems.default');
  }

  /**
   * Upload a file to the specified directory.
   */
  public function upload(UploadedFile $file, string $directory, ?string $disk = null): string
  {
    $disk = $this->resolveDisk($disk);
    $filename = $this->generateUniqueFilename($file);

    return $file->storeAs($directory, $filename, $disk);
  }

  /**
   * Upload multiple files.
   */
  public function uploadMultiple(array $files, string $directory, ?string $disk = null): array
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
  public function delete(string $path, ?string $disk = null): bool
  {
    $disk = $this->resolveDisk($disk);

    if (Storage::disk($disk)->exists($path)) {
      return Storage::disk($disk)->delete($path);
    }

    return false;
  }

  /**
   * Delete multiple files from storage.
   */
  public function deleteMultiple(array $paths, ?string $disk = null): bool
  {
    foreach ($paths as $path) {
      $this->delete($path, $disk);
    }

    return true;
  }

  /**
   * Get the URL for a file.
   */
  public function getUrl(string $path, ?string $disk = null): string
  {
    return Storage::disk($this->resolveDisk($disk))->url($path);
  }

  /**
   * Check if a file exists.
   */
  public function exists(string $path, ?string $disk = null): bool
  {
    return Storage::disk($this->resolveDisk($disk))->exists($path);
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
