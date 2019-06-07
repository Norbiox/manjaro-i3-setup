if empty(glob('~/.vim/autoload/plug.vim'))
  silent !curl -fLo ~/.vim/autoload/plug.vim --create-dirs
    \ https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  autocmd VimEnter * PlugInstall --sync | source $MYVIMRC
endif

call plug#begin('~/.vim/plugged')
Plug 'itchyny/lightline.vim'
Plug 'joshdick/onedark.vim'
Plug 'sheerun/vim-polyglot'
Plug 'gabrielelana/vim-markdown'
Plug 'itchyny/lightline.vim'
Plug 'plasticboy/vim-markdown'
Plug 'tpope/vim-surround'
call plug#end()

set laststatus=2
let g:lightline = {
    \ 'colorscheme': 'onedark',
    \ }
colorscheme onedark
syntax on

set relativenumber
set clipboard=unnamedplus
set mouse=a
set number	
set showmatch
set hlsearch
set smartcase
set autoindent
set expandtab
set shiftwidth=4
set smartindent
set smarttab
set softtabstop=4
set undolevels=1000
set colorcolumn=80

map @ :noh<CR>

noremap <Up> <NOP>
noremap <Down> <NOP>
noremap <Left> <NOP>
noremap <Right> <NOP>
