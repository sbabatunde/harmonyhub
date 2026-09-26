<?php

namespace App\Support\Services\Contracts;

use Illuminate\Http\UploadedFile;

interface FileUploadServiceInterface
{
  public function upload(UploadedFile $file, string $directory, ?string $disk = null): string;
  public function uploadMultiple(array $files, string $directory, ?string $disk = null): array;
  public function delete(string $path, ?string $disk = null): bool;
  public function deleteMultiple(array $paths, ?string $disk = null): bool;
  public function getUrl(string $path, ?string $disk = null): string;
  public function exists(string $path, ?string $disk = null): bool;
}
