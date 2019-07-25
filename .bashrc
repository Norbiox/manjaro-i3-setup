#
# ~/.bashrc
#
[[ $- != *i* ]] && return

# user variables
export PACKTBOTEMAIL="norbiox.pi@gmail.com"
export PACKTBOTPASSWORD="Malina314"

# better yaourt colors
export YAOURT_COLORS="nb=1:pkg=1:ver=1;32:lver=1;45:installed=1;42:grp=1;34:od=1;41;5:votes=1;44:dsc=0:other=1;35"

export HISTTIMEFORMAT='%F %T '
export HISTSIZE=1000
export HISTFILESIZE=1000
# remove duplicates from history
export HISTCONTROL=ignoreboth:erasedups

colors() {
	local fgc bgc vals seq0

	printf "Color escapes are %s\n" '\e[${value};...;${value}m'
	printf "Values 30..37 are \e[33mforeground colors\e[m\n"
	printf "Values 40..47 are \e[43mbackground colors\e[m\n"
	printf "Value  1 gives a  \e[1mbold-faced look\e[m\n\n"

	# foreground colors
	for fgc in {30..37}; do
		# background colors
		for bgc in {40..47}; do
			fgc=${fgc#37} # white
			bgc=${bgc#40} # black

			vals="${fgc:+$fgc;}${bgc}"
			vals=${vals%%;}

			seq0="${vals:+\e[${vals}m}"
			printf "  %-9s" "${seq0:-(default)}"
			printf " ${seq0}TEXT\e[m"
			printf " \e[${vals:+${vals+$vals;}}1mBOLD\e[m"
		done
		echo; echo
	done
}

[ -r /usr/share/bash-completion/bash_completion ] && . /usr/share/bash-completion/bash_completion


# Git status functions
function git_color {
 if [ -z "$(git status -s 2> /dev/null)" ]
 then 
     echo -e '\e[0;32m'
 else
     echo -e '\e[0;31m'
 fi
}

parse_git_branch() {
  git branch 2> /dev/null | sed -e '/^[^*]/d' -e "s/* \(.*\)/$(git_color)(\1)/"
}


use_color=true

# Set colorful PS1 only on colorful terminals.
# dircolors --print-database uses its own built-in database
# instead of using /etc/DIR_COLORS.  Try to use the external file
# first to take advantage of user additions.  Use internal bash
# globbing instead of external grep binary.
safe_term=${TERM//[^[:alnum:]]/?}   # sanitize TERM
match_lhs=""
[[ -f ~/.dir_colors   ]] && match_lhs="${match_lhs}$(<~/.dir_colors)"
[[ -f /etc/DIR_COLORS ]] && match_lhs="${match_lhs}$(</etc/DIR_COLORS)"
[[ -z ${match_lhs}    ]] \
	&& type -P dircolors >/dev/null \
	&& match_lhs=$(dircolors --print-database)
[[ $'\n'${match_lhs} == *$'\n'"TERM "${safe_term}* ]] && use_color=true

if ${use_color} ; then
	# Enable colors for ls, etc.  Prefer ~/.dir_colors #64489
	if type -P dircolors >/dev/null ; then
		if [[ -f ~/.dir_colors ]] ; then
			eval $(dircolors -b ~/.dir_colors)
		elif [[ -f /etc/DIR_COLORS ]] ; then
			eval $(dircolors -b /etc/DIR_COLORS)
		fi
	fi

	if [[ ${EUID} == 0 ]] ; then
            PS1="\[\e[1;34m\][\h \[\e[1;37m\]\W[\e[1;34m\]]"
	else
            PS1="\[\e[1;34m\][\u@\h \[\e[1;37m\]\W\[\e[1;34m\]]\$(parse_git_branch)\[\e[00m\]\$ "
	fi

	alias ls='ls --color=auto'
	alias grep='grep --colour=auto'
	alias egrep='egrep --colour=auto'
	alias fgrep='fgrep --colour=auto'
else
	if [[ ${EUID} == 0 ]] ; then
		PS1='\u@\h \W \$ '
	else
		PS1='\u@\h \w \$ '
	fi
fi

unset use_color safe_term match_lhs sh

# User functions
v() {
    if [[ -d "./venv" && -z "$VIRTUAL_ENV" ]]; then
        source ./venv/bin/activate
        echo "Virtual environment activated. Python version: `python --version | cut -d' ' -f2`"
    elif [[ -n "$VIRTUAL_ENV" ]]; then
        deactivate
        echo "Virtual environment deactivated."
    else
        echo "Virtual environment has not beed detected in current directory."
    fi
}

function cdls {
    builtin cd "$@" && ls
    }

# Aliases
alias df='df -h'                          # human-readable sizes
alias free='free -m'                      # show sizes in MB
alias np='nano -w PKGBUILD'
alias more=less

# User aliases
alias upd="yay -Syu"
alias keys="cat .config/i3/config | grep '^bindsym \$mod+' | sed 's/^bindsym \$mod+//'"
alias h="history"
alias hg="history | grep"
alias cd="cdls"

# Git aliases
alias gst='git status'
alias gaa='git add -A'
alias gcm='git commit -m'
alias gcma='git commit -a -m'
alias gwait='git reset HEAD' # Unstages everything.
alias gl='git log --graph --pretty='\''%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset'\'' --abbrev-commit'
alias gundo='git reset --soft HEAD^' # Undoes the last commit and moves the files in the commit to staging.
alias gco='git checkout'
alias gpusho="git push origin ${parse_git_branch}"
alias gpullo="git pull --rebase origin ${parse_git_branch}"

xhost +local:root > /dev/null 2>&1

complete -cf sudo

# Bash won't get SIGWINCH if another process is in the foreground.
# Enable checkwinsize so that bash will check the terminal size when
# it regains control.  #65623
# http://cnswww.cns.cwru.edu/~chet/bash/FAQ (E11)
shopt -s checkwinsize

shopt -s expand_aliases

# export QT_SELECT=4

# Enable history appending instead of overwriting.  #139609
shopt -s histappend

#
# # ex - archive extractor
# # usage: ex <file>
ex ()
{
  if [ -f $1 ] ; then
    case $1 in
      *.tar.bz2)   tar xjf $1   ;;
      *.tar.gz)    tar xzf $1   ;;
      *.bz2)       bunzip2 $1   ;;
      *.rar)       unrar x $1     ;;
      *.gz)        gunzip $1    ;;
      *.tar)       tar xf $1    ;;
      *.tbz2)      tar xjf $1   ;;
      *.tgz)       tar xzf $1   ;;
      *.zip)       unzip $1     ;;
      *.Z)         uncompress $1;;
      *.7z)        7z x $1      ;;
      *)           echo "'$1' cannot be extracted via ex()" ;;
    esac
  else
    echo "'$1' is not a valid file"
  fi
}
